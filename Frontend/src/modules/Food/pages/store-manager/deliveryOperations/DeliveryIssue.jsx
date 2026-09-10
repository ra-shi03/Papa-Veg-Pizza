import React, { useState, useEffect } from "react";
import { Search, RotateCcw, RefreshCw, AlertCircle, Plus } from "lucide-react";
import { Input, Select } from "antd";

// Hooks
import useDeliveryIssues from "./hooks/useDeliveryIssues";
import useIssueSocket from "./hooks/useIssueSocket";

// Components
import SocketStatusBadge from "../kitchenOperations/components/SocketStatusBadge";
import IssueStatsCards from "./components/IssueStatsCards";
import IssueTable from "./components/IssueTable";
import CreateIssueModal from "./components/CreateIssueModal";
import IssueDetailsModal from "./components/IssueDetailsModal";

export default function DeliveryIssue() {
  // Theme state
  const [themePrimary, setThemePrimary] = useState(localStorage.getItem("sa_primary") || "#a43c12");
  const [themeSecondary, setThemeSecondary] = useState(localStorage.getItem("sa_secondary") || "#ff7f50");

  useEffect(() => {
    const primary = localStorage.getItem("sa_primary") || "#a43c12";
    const secondary = localStorage.getItem("sa_secondary") || "#ff7f50";
    setThemePrimary(primary);
    setThemeSecondary(secondary);

    document.documentElement.style.setProperty("--sa-primary", primary);
    document.documentElement.style.setProperty("--sa-primary-hover", `${primary}cc`);
    document.documentElement.style.setProperty("--sa-secondary", secondary);
    document.documentElement.style.setProperty("--sa-secondary-hover", `${secondary}cc`);
    document.documentElement.style.setProperty("--primary", primary);
    document.documentElement.style.setProperty("--primary-hover", `${primary}cc`);
    document.documentElement.style.setProperty("--secondary", secondary);
    document.documentElement.style.setProperty("--secondary-hover", `${secondary}cc`);
  }, []);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    issueType: "All",
    status: "All",
    severity: "All"
  });
  const [searchInput, setSearchInput] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Debounce search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Queries & Sockets
  const { data: issuesList = [], isLoading: isLoadingIssues, refetch: refetchIssues } = useDeliveryIssues(filters);
  const { socketConnected } = useIssueSocket();

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleManualRefetch = () => {
    refetchIssues();
    setLastRefreshed(new Date());
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setFilters({
      search: "",
      issueType: "All",
      status: "All",
      severity: "All"
    });
  };

  const handleOpenDetails = (issueId) => {
    setSelectedIssueId(issueId);
    setShowDetailsModal(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-8xl mx-auto min-h-screen text-slate-800 dark:text-zinc-200">
      
      {/* Page Header */}
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-zinc-855 shadow-sm transition-all duration-300">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Delivery Issues</span>
            <AlertCircle size={16} className="text-rose-500 animate-bounce-subtle" />
          </h1>
          <p className="text-xs font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
            Manage all active exceptions, breakdowns, customer complaints, and reassignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SocketStatusBadge connected={socketConnected} />

          <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-zinc-855">
            UPDATED: {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
          </span>

          <button
            onClick={handleManualRefetch}
            className="h-8 w-8 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-slate-655 dark:text-zinc-400 border border-slate-150 dark:border-zinc-855 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm hover:rotate-180 duration-500"
            title="Refresh Issues List"
          >
            <RefreshCw size={12} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{ backgroundColor: "var(--primary)" }}
            className="h-8 px-3 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all shadow-sm cursor-pointer text-white hover:opacity-90 flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>New Issue</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <IssueStatsCards issues={issuesList} />

      {/* Main Table section */}
      <div className="space-y-4">
        
        {/* Filters Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-3 rounded-2.5xl flex flex-wrap gap-2.5 items-center justify-between shadow-sm transition-all duration-300">
          <div className="flex-1 min-w-[180px] max-w-xs">
            <Input
              prefix={<Search size={14} className="text-slate-400 mr-1" />}
              placeholder="Search Ticket, Order ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="compact-input rounded-xl text-xs h-9 bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-855 hover:border-slate-200 dark:hover:border-zinc-850 text-slate-800 dark:text-white"
              allowClear
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Issue Type */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-slate-400 dark:text-zinc-555 uppercase">Type:</span>
              <Select
                value={filters.issueType || "All"}
                onChange={(val) => setFilters(prev => ({ ...prev, issueType: val }))}
                className="sa-select w-28 text-xs font-bold"
                options={[
                  { value: "All", label: "All" },
                  { value: "Late Delivery", label: "Late Delivery" },
                  { value: "Rider Not Responding", label: "No Response" },
                  { value: "Wrong Address", label: "Wrong Address" },
                  { value: "Customer Unreachable", label: "Unreachable" },
                  { value: "Vehicle Breakdown", label: "Breakdown" },
                  { value: "Order Damaged", label: "Damaged" },
                  { value: "Customer Complaint", label: "Complaint" },
                  { value: "Payment Issue", label: "Payment" }
                ]}
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-slate-400 dark:text-zinc-555 uppercase">Status:</span>
              <Select
                value={filters.status || "All"}
                onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
                className="sa-select w-26 text-xs font-bold"
                options={[
                  { value: "All", label: "All" },
                  { value: "Open", label: "Open" },
                  { value: "In Progress", label: "In Progress" },
                  { value: "Resolved", label: "Resolved" },
                  { value: "Escalated", label: "Escalated" },
                  { value: "Closed", label: "Closed" }
                ]}
              />
            </div>

            {/* Severity */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-slate-400 dark:text-zinc-555 uppercase">Severity:</span>
              <Select
                value={filters.severity || "All"}
                onChange={(val) => setFilters(prev => ({ ...prev, severity: val }))}
                className="sa-select w-24 text-xs font-bold"
                options={[
                  { value: "All", label: "All" },
                  { value: "Low", label: "Low" },
                  { value: "Medium", label: "Medium" },
                  { value: "Critical", label: "Critical" }
                ]}
              />
            </div>

            <button
              onClick={handleResetFilters}
              className="h-9 px-3 border border-slate-250 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-655 dark:text-zinc-400 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-extrabold cursor-pointer shadow-xs"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Live Issue Table view */}
        <IssueTable
          issues={issuesList}
          isLoading={isLoadingIssues}
          onViewIssue={handleOpenDetails}
        />

      </div>

      {/* New Issue Creator Drawer/Modal */}
      <CreateIssueModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Issue Details Hub Overlay */}
      <IssueDetailsModal
        visible={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedIssueId(null);
        }}
        issueId={selectedIssueId}
      />

    </div>
  );
}
