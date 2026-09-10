import React, { useState, useEffect } from "react";
import { Search, Download, RefreshCw, RotateCcw, UserPlus } from "lucide-react";
import { useLoyalty } from "./hooks/useLoyalty";
import LoyaltyAnalytics from "./components/LoyaltyAnalytics";
import LoyaltyTable from "./components/LoyaltyTable";
import LoyaltyDrawer from "./components/LoyaltyDrawer";
import { 
  EnrollMemberModal, 
  AdjustPointsModal, 
  UpgradeTierModal, 
  SuspendMemberModal, 
  TransactionDetailsModal,
  ExportStatementModal 
} from "./components/LoyaltyModals";

export default function LoyaltyMembers() {
  const useLoyaltyHook = useLoyalty();
  const {
    members,
    loading,
    totalCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    tier,
    setTier,
    status,
    setStatus,
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    stats,
    analytics,
    enrollMember,
    adjustPoints,
    upgradeTier,
    suspendMember,
    exportStatement,
    refetch
  } = useLoyaltyHook;

  // Local Search State for Debounce
  const [localSearch, setLocalSearch] = useState(search);
  
  // Modals Visibility
  const [showEnroll, setShowEnroll] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);
  const [showExport, setShowExport] = useState(false);
  
  // Drawer Visibility
  const [showDrawer, setShowDrawer] = useState(false);

  // Active Context loyalty member & transaction
  const [activeMember, setActiveMember] = useState(null);
  const [activeTransaction, setActiveTransaction] = useState(null);

  // Debouncing Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [localSearch, setSearch, setCurrentPage]);

  const handleActionClick = (member, action) => {
    setActiveMember(member);

    if (action === "view") {
      setShowDrawer(true);
    } else if (action === "adjust") {
      setShowAdjust(true);
    } else if (action === "upgrade") {
      setShowUpgrade(true);
    } else if (action === "suspend") {
      if (member.status === "Suspended") {
        setShowSuspend(true); // Will trigger Reactivate confirmation
      } else {
        setShowSuspend(true);
      }
    } else if (action === "export-statement") {
      setShowExport(true);
    }
  };

  const handleTransactionClick = (transaction) => {
    setActiveTransaction(transaction);
    setShowTransaction(true);
  };

  return (
    <div className="p-3 md:p-5 max-w-7xl mx-auto space-y-4 text-xs bg-slate-50 dark:bg-zinc-950 min-h-screen text-zinc-700 dark:text-zinc-300">
      
      {/* Top Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Loyalty Members Desk
            </h1>
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-amber-500/20">
              Live DB
            </span>
          </div>
          <p className="text-zinc-450 dark:text-zinc-400 mt-0.5 text-[10px] font-semibold">
            Manage reward members, points, tiers, and customer retention.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setShowExport(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg shadow-sm font-bold text-zinc-750 dark:text-zinc-200 transition-all cursor-pointer"
          >
            <Download size={13} className="text-[var(--primary)]" />
            <span>Export Statement</span>
          </button>
          
          <button 
            onClick={() => setShowEnroll(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--primary)] text-white hover:opacity-95 rounded-lg shadow-sm font-bold uppercase transition-all cursor-pointer text-[10px]"
          >
            <UserPlus size={12} />
            <span>Enroll Member</span>
          </button>
          
          <button 
            onClick={() => { refetch(); }}
            className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 rounded-lg transition-all text-zinc-650 dark:text-zinc-300 cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* Analytics & Stats */}
      <LoyaltyAnalytics stats={stats} analytics={analytics} />

      {/* Filter Section (Sticky) */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-3 sticky top-16 z-20">
        
        {/* Row 1: Search and Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Debounced Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Name, Phone, Email, Mem No..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold"
            />
          </div>

          {/* Tier Filter */}
          <div>
            <select
              value={tier}
              onChange={e => { setTier(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <option value="All">All Loyalty Tiers</option>
              <option value="Bronze">Bronze Tier</option>
              <option value="Silver">Silver Tier</option>
              <option value="Gold">Gold Tier</option>
              <option value="Platinum">Platinum Tier</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Accounts</option>
              <option value="Inactive">Inactive Accounts</option>
              <option value="Suspended">Suspended Accounts</option>
              <option value="Expired">Expired Accounts</option>
            </select>
          </div>

          {/* Joined Date Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase text-zinc-450">Joined:</span>
            <div className="flex gap-1 flex-1">
              {["All", "Today", "This Month", "Custom"].map(opt => (
                <button
                  key={opt}
                  onClick={() => {
                    setDateFilter(opt);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer flex-1 ${
                    dateFilter === opt 
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]" 
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                  }`}
                >
                  {opt === "Custom" ? "Range" : opt}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Row 2: Custom Date & Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-850/50">
          <div className="flex items-center gap-2">
            {/* Custom Range Inputs */}
            {dateFilter === "Custom" && (
              <div className="flex items-center gap-1.5 animate-fade-down">
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={e => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="p-1 text-[10px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded outline-none"
                />
                <span className="text-zinc-400 font-bold">-</span>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={e => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="p-1 text-[10px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setLocalSearch("");
                setSearch("");
                setTier("All");
                setStatus("All");
                setDateFilter("All");
                setCustomDateRange({ start: "", end: "" });
                setSortBy("joinedDate");
                setSortOrder("desc");
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold transition-all text-zinc-655 dark:text-zinc-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              Reset Filters
            </button>
          </div>
        </div>

      </section>

      {/* Database Table & Pagination */}
      <LoyaltyTable
        members={members}
        loading={loading}
        totalCount={totalCount}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        handleActionClick={handleActionClick}
      />

      {/* Slideout Detail Drawer */}
      <LoyaltyDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        memberId={activeMember?._id}
        useLoyaltyHook={useLoyaltyHook}
        onAdjustPointsClick={(m) => handleActionClick(m, "adjust")}
        onUpgradeTierClick={(m) => handleActionClick(m, "upgrade")}
        onSuspendClick={(m) => handleActionClick(m, "suspend")}
        onViewTransactionClick={handleTransactionClick}
      />

      {/* Modals Containers */}
      <EnrollMemberModal
        isOpen={showEnroll}
        onClose={() => setShowEnroll(false)}
        onSubmit={enrollMember}
      />

      <AdjustPointsModal
        isOpen={showAdjust}
        onClose={() => setShowAdjust(false)}
        member={activeMember}
        onSubmit={adjustPoints}
      />

      <UpgradeTierModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        member={activeMember}
        onSubmit={upgradeTier}
      />

      <SuspendMemberModal
        isOpen={showSuspend}
        onClose={() => setShowSuspend(false)}
        member={activeMember}
        onSubmit={suspendMember}
      />

      <TransactionDetailsModal
        isOpen={showTransaction}
        onClose={() => setShowTransaction(false)}
        transaction={activeTransaction}
      />

      <ExportStatementModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        onExport={exportStatement}
      />

    </div>
  );
}
