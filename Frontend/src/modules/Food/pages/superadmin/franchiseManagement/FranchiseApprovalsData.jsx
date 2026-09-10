import React, { useState, useEffect } from "react";
import { Search, Eye, CheckCircle, XCircle, ChevronLeft, ChevronRight, SlidersHorizontal, RefreshCw, AlertCircle, FileEdit, Clock, Calendar, CheckSquare } from "lucide-react";

export default function FranchiseApprovalsData({
  applications = [],
  onRowClick,
  onApprove,
  onReject,
  onRequestChanges,
  onViewAudit,
  selectedApplicationIds = [],
  onToggleSelect,
  onToggleSelectAll,
}) {
  const [isOpenFilters, setIsOpenFilters] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filterAppId, setFilterAppId] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterTerritory, setFilterTerritory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Debounce hook search query (400ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterAppId("");
    setFilterName("");
    setFilterCompany("");
    setFilterEmail("");
    setFilterPhone("");
    setFilterRegion("");
    setFilterZone("");
    setFilterTerritory("");
    setFilterStatus("");
  };

  // Filtered applications logic
  const filteredApps = applications.filter((app) => {
    // Global search query matching across ID, name, email, company, and phone
    const matchesSearch =
      !debouncedSearch ||
      app.id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      app.applicantName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      app.companyName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      app.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      app.phone.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesAppId = !filterAppId || app.id.toLowerCase().includes(filterAppId.toLowerCase());
    const matchesName = !filterName || app.applicantName.toLowerCase().includes(filterName.toLowerCase());
    const matchesCompany = !filterCompany || app.companyName.toLowerCase().includes(filterCompany.toLowerCase());
    const matchesEmail = !filterEmail || app.email.toLowerCase().includes(filterEmail.toLowerCase());
    const matchesPhone = !filterPhone || app.phone.toLowerCase().includes(filterPhone.toLowerCase());
    const matchesRegion = !filterRegion || app.region.toLowerCase().includes(filterRegion.toLowerCase());
    const matchesZone = !filterZone || app.zone.toLowerCase().includes(filterZone.toLowerCase());
    const matchesTerritory = !filterTerritory || app.territory.toLowerCase().includes(filterTerritory.toLowerCase());
    const matchesStatus = !filterStatus || app.status === filterStatus;

    return (
      matchesSearch &&
      matchesAppId &&
      matchesName &&
      matchesCompany &&
      matchesEmail &&
      matchesPhone &&
      matchesRegion &&
      matchesZone &&
      matchesTerritory &&
      matchesStatus
    );
  });

  const isAllSelected = filteredApps.length > 0 && filteredApps.every((app) => selectedApplicationIds.includes(app.id));

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filterAppId, filterName, filterCompany, filterEmail, filterPhone, filterRegion, filterZone, filterTerritory, filterStatus]);

  const totalPages = Math.ceil(filteredApps.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApps = filteredApps.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending Review":
        return "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40";
      case "Under Verification":
        return "bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40";
      case "Changes Requested":
        return "bg-purple-100 text-purple-900 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-900/40";
      case "Approved":
        return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40";
      case "Rejected":
        return "bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40";
      default:
        return "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700";
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl overflow-hidden shadow-sm flex flex-col w-full">
      {/* Header bar with primary search & filter toggle */}
      <div className="p-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h5 className="text-sm font-bold text-black dark:text-zinc-100 uppercase tracking-wider">
            Franchise Applications
          </h5>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative max-w-xs w-full flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black dark:text-zinc-300" size={14} />
            <input
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-zinc-200 placeholder-black/55 dark:placeholder-zinc-400 focus:border-[var(--primary)] focus:ring-0 outline-none transition-all font-semibold"
              placeholder="Search ID, name, email..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => setIsOpenFilters(!isOpenFilters)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${isOpenFilters
                ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-850"
              }`}
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </button>

          <button
            onClick={handleResetFilters}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
            title="Reset Filters"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Collapsible Filter Panel */}
      {isOpenFilters && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-900 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 animate-fadeIn">
          <div>
            <label className="text-[10px] font-bold text-black dark:text-zinc-300 uppercase tracking-wide">Application ID</label>
            <input
              type="text"
              value={filterAppId}
              onChange={(e) => setFilterAppId(e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-md text-xs text-black dark:text-zinc-200 outline-none focus:border-[var(--primary)] font-semibold"
              placeholder="e.g. APP-001"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-black dark:text-zinc-300 uppercase tracking-wide">Applicant Name</label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-md text-xs text-black dark:text-zinc-200 outline-none focus:border-[var(--primary)] font-semibold"
              placeholder="e.g. Rajesh Kumar"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-black dark:text-zinc-300 uppercase tracking-wide">Company Name</label>
            <input
              type="text"
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-md text-xs text-black dark:text-zinc-200 outline-none focus:border-[var(--primary)] font-semibold"
              placeholder="e.g. RK Foods"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-black dark:text-zinc-300 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-md text-xs text-black dark:text-zinc-200 outline-none focus:border-[var(--primary)] font-semibold"
              placeholder="e.g. rajesh@email.com"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-black dark:text-zinc-300 uppercase tracking-wide">Phone</label>
            <input
              type="text"
              value={filterPhone}
              onChange={(e) => setFilterPhone(e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-md text-xs text-black dark:text-zinc-200 outline-none focus:border-[var(--primary)] font-semibold"
              placeholder="e.g. 98765"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-black dark:text-zinc-300 uppercase tracking-wide">Requested Region</label>
            <input
              type="text"
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-md text-xs text-black dark:text-zinc-200 outline-none focus:border-[var(--primary)] font-semibold"
              placeholder="e.g. North"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-black dark:text-zinc-300 uppercase tracking-wide">Requested Zone</label>
            <input
              type="text"
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-md text-xs text-black dark:text-zinc-200 outline-none focus:border-[var(--primary)] font-semibold"
              placeholder="e.g. Zone-A"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-black dark:text-zinc-300 uppercase tracking-wide">Requested Territory</label>
            <input
              type="text"
              value={filterTerritory}
              onChange={(e) => setFilterTerritory(e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-md text-xs text-black dark:text-zinc-200 outline-none focus:border-[var(--primary)] font-semibold"
              placeholder="e.g. Delhi-NCR"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-black dark:text-zinc-300 uppercase tracking-wide">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-md text-xs text-black dark:text-zinc-200 outline-none focus:border-[var(--primary)] font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Under Verification">Under Verification</option>
              <option value="Changes Requested">Changes Requested</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full py-1.5 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-200 rounded-md text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}

      {/* 14-Column Responsive Table Grid */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">
        <table className="w-full text-left border-collapse min-w-[1500px]">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-900">
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider w-12 text-center select-none">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-[var(--primary)] focus:ring-0 cursor-pointer"
                  checked={isAllSelected}
                  onChange={(e) => onToggleSelectAll && onToggleSelectAll(filteredApps.map((a) => a.id), e.target.checked)}
                />
              </th>
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Application ID</th>
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Applicant Name</th>
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Company Name</th>
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Phone</th>
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Region</th>
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Zone</th>
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Territory</th>
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Submitted Date</th>
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider text-center">Docs</th>
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Reviewer</th>
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Last Updated</th>
              <th className="px-4 py-3 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider text-right sticky right-0 bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-900 z-10">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
            {paginatedApps.map((app) => {
              const isSelected = selectedApplicationIds.includes(app.id);
              return (
                <tr
                  key={app.id}
                  className={`hover:bg-[var(--primary)]/5 dark:hover:bg-[var(--primary)]/10 transition-colors group cursor-pointer ${isSelected ? "bg-zinc-50 dark:bg-zinc-900/30" : ""
                    }`}
                  onClick={() => onRowClick && onRowClick(app)}
                >
                  <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-[var(--primary)] focus:ring-0 cursor-pointer"
                      checked={isSelected}
                      onChange={() => onToggleSelect && onToggleSelect(app.id)}
                    />
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-[var(--primary)] font-bold">{app.id}</td>
                  <td className="px-4 py-3.5 text-xs font-bold text-black dark:text-zinc-100">{app.applicantName}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-black dark:text-zinc-200">{app.companyName}</td>
                  <td className="px-4 py-3.5 text-xs font-medium text-black dark:text-zinc-200">{app.email}</td>
                  <td className="px-4 py-3.5 text-xs font-medium text-black dark:text-zinc-200">{app.phone}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-black dark:text-zinc-200">{app.region}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-black dark:text-zinc-200">{app.zone}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-black dark:text-zinc-200">{app.territory}</td>
                  <td className="px-4 py-3.5 text-xs font-medium text-black dark:text-zinc-200">{app.submittedDate}</td>
                  <td className="px-4 py-3.5 text-xs font-bold text-center text-black dark:text-zinc-100">
                    <span className="bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                      {app.documentsCount}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-0.5 text-[9px] rounded font-bold uppercase ${getStatusBadge(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-black dark:text-zinc-200">{app.reviewer || "Not Assigned"}</td>
                  <td className="px-4 py-3.5 text-xs font-medium text-black dark:text-zinc-200">{app.lastUpdated}</td>

                  {/* Contextual actions menu row (fixed right) */}
                  <td className="px-4 py-3.5 text-right sticky right-0 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-900 z-10 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-900 transition-colors" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-black hover:text-[var(--primary)] dark:text-zinc-300 dark:hover:text-white transition-colors"
                        title="View & Review"
                        onClick={() => onRowClick && onRowClick(app)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded text-emerald-600 hover:text-emerald-700 transition-colors"
                        title="Approve Franchise"
                        onClick={() => onApprove && onApprove(app)}
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        className="p-1 hover:bg-purple-50 dark:hover:bg-purple-950/20 rounded text-purple-600 hover:text-purple-700 transition-colors"
                        title="Request Changes"
                        onClick={() => onRequestChanges && onRequestChanges(app)}
                      >
                        <FileEdit size={14} />
                      </button>
                      <button
                        className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-rose-600 hover:text-rose-700 transition-colors"
                        title="Reject Application"
                        onClick={() => onReject && onReject(app)}
                      >
                        <XCircle size={14} />
                      </button>
                      <button
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                        title="View Audit History"
                        onClick={() => onViewAudit && onViewAudit(app)}
                      >
                        <Clock size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredApps.length === 0 && (
              <tr>
                <td colSpan="15" className="px-4 py-8 text-center text-black dark:text-zinc-300 text-xs font-bold">
                  No franchise applications found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 mt-auto">
        <p className="text-[11px] font-bold text-black dark:text-zinc-300">
          Showing {filteredApps.length > 0 ? startIndex + 1 : 0} to{" "}
          {Math.min(startIndex + itemsPerPage, filteredApps.length)} of {filteredApps.length} entries
        </p>

        <div className="flex items-center gap-1 select-none">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="w-7 h-7 flex items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 text-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40 transition-colors font-bold cursor-pointer"
            disabled={currentPage === 1}
          >
            <ChevronLeft size={12} />
          </button>

          {Array.from({ length: totalPages }).map((_, pageIdx) => {
            const pageNum = pageIdx + 1;
            const isCurrent = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-all cursor-pointer ${isCurrent
                    ? "bg-[var(--primary)] text-white shadow-sm font-black"
                    : "border border-zinc-200 dark:border-zinc-800 text-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            className="w-7 h-7 flex items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 text-black dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40 transition-colors font-bold cursor-pointer"
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
