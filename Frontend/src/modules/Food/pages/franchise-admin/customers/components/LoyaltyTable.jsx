import React, { useState, useEffect, useRef } from "react";
import { 
  Trophy, Eye, Settings, ShieldAlert, FileText, Download,
  ArrowUpDown, MoreVertical, ChevronLeft, ChevronRight, Ban, CheckCircle2 
} from "lucide-react";

export default function LoyaltyTable({
  members,
  loading,
  totalCount,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  handleActionClick
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
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
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-450 border-yellow-500/25";
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
        return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleMenuAction = (member, action) => {
    setActiveMenuId(null);
    handleActionClick(member, action);
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
      
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1050px]">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-850 text-[10px] uppercase font-bold text-zinc-450 tracking-wider">
            <tr>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("membershipNumber")}>
                <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                  Membership No.
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("tier")}>
                <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                  Tier
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("totalPoints")}>
                <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                  Total Points
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("availablePoints")}>
                <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                  Available Pts
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("totalSpent")}>
                <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                  Lifetime Spend
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("lastActivityDate")}>
                <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                  Last Activity
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("expiryDate")}>
                <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                  Expiry Date
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/85">
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-zinc-450">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                    <span className="font-semibold text-xs">Querying MongoDB Loyalty DB...</span>
                  </div>
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-zinc-400 font-semibold">
                  No loyalty members found matching filter parameters.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 text-zinc-750 dark:text-zinc-355 transition-colors">
                  {/* Membership Number */}
                  <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-100">
                    {member.membershipNumber}
                  </td>

                  {/* Customer Details */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-[10px]">
                        {member.customerName?.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) || "LM"}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-850 dark:text-zinc-200">{member.customerName}</div>
                        <div className="text-[9px] text-zinc-400 font-semibold mt-0.5">{member.customerPhone}</div>
                      </div>
                    </div>
                  </td>

                  {/* Tier */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${getTierBadge(member.tier)}`}>
                      {member.tier}
                    </span>
                  </td>

                  {/* Total Points */}
                  <td className="px-4 py-3 font-bold text-zinc-650 dark:text-zinc-400">
                    {member.totalPoints}
                  </td>

                  {/* Available Points */}
                  <td className="px-4 py-3">
                    <span className="font-extrabold text-[10px] text-amber-500">{member.availablePoints} Pts</span>
                  </td>

                  {/* Lifetime Spend */}
                  <td className="px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300">
                    ₹{member.totalSpent?.toLocaleString("en-IN") || 0}
                  </td>

                  {/* Last Activity */}
                  <td className="px-4 py-3 font-semibold text-zinc-450 dark:text-zinc-400">
                    {formatDate(member.lastActivityDate)}
                  </td>

                  {/* Expiry Date */}
                  <td className="px-4 py-3 font-semibold text-zinc-450 dark:text-zinc-400">
                    {formatDate(member.expiryDate)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase ${getStatusChip(member.status)}`}>
                      {member.status}
                    </span>
                  </td>

                  {/* Actions Dropdown */}
                  <td className="px-4 py-3 text-right relative">
                    <div className="flex justify-end items-center gap-1.5">
                      
                      <button
                        onClick={() => handleActionClick(member, "view")}
                        className="p-1 text-zinc-400 hover:text-[var(--primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === member._id ? null : member._id)}
                          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {activeMenuId === member._id && (
                          <div 
                            ref={menuRef} 
                            className="absolute right-0 mt-1 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 animate-fade-down duration-100"
                          >
                            <div className="py-1">
                              <button
                                onClick={() => handleMenuAction(member, "view")}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350 cursor-pointer font-semibold"
                              >
                                <Eye size={12} />
                                <span>View Details</span>
                              </button>
                              
                              <button
                                onClick={() => handleMenuAction(member, "adjust")}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350 cursor-pointer font-semibold"
                              >
                                <Settings size={12} className="text-amber-500" />
                                <span>Adjust Points</span>
                              </button>

                              <button
                                onClick={() => handleMenuAction(member, "upgrade")}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350 cursor-pointer font-semibold"
                              >
                                <Trophy size={12} className="text-yellow-500" />
                                <span>Upgrade Tier</span>
                              </button>
                            </div>

                            <div className="py-1">
                              <button
                                onClick={() => handleMenuAction(member, "suspend")}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350 cursor-pointer font-semibold"
                              >
                                {member.status === "Suspended" ? (
                                  <>
                                    <CheckCircle2 size={12} className="text-emerald-500" />
                                    <span>Reactivate</span>
                                  </>
                                ) : (
                                  <>
                                    <Ban size={12} className="text-rose-500" />
                                    <span>Suspend Member</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleMenuAction(member, "export-statement")}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350 cursor-pointer font-semibold"
                              >
                                <Download size={12} className="text-blue-500" />
                                <span>Export Statement</span>
                              </button>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      {totalPages > 0 && (
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-450 dark:text-zinc-400 font-semibold select-none">
          
          <div className="flex items-center gap-2 text-[10px]">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="p-1 rounded border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 outline-none text-[10px] font-bold cursor-pointer"
            >
              {[5, 10, 20, 50].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>Showing {Math.min(totalCount, (currentPage - 1) * pageSize + 1)}-{Math.min(totalCount, currentPage * pageSize)} of {totalCount} records</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronLeft size={13} />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-6 h-6 rounded-lg text-[10px] font-extrabold flex items-center justify-center border transition-all cursor-pointer ${
                    currentPage === page
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-550 hover:bg-zinc-50 dark:hover:bg-zinc-855"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-855 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronRight size={13} />
            </button>
          </div>

        </div>
      )}

    </section>
  );
}
