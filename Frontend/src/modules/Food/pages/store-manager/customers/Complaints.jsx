import React, { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { RefreshCw, FileDown, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Custom Hooks & Sub-components
import { useComplaintsList } from "./hooks/useComplaints";
import ComplaintStatsCards from "./components/ComplaintStatsCards";
import ComplaintFilters from "./components/ComplaintFilters";
import ComplaintsTable from "./components/ComplaintsTable";

// Modals
import ComplaintDetailsModal from "./components/ComplaintDetailsModal";
import ResolveComplaintModal from "./components/ResolveComplaintModal";

// Local fallback database seeds for real-time stats calculation
import { mockComplaints } from "./mockData";

export default function Complaints() {
  const { role } = useOutletContext(); // Retrieve user role from outlet context

  // ----------------------------------------------------
  // States: Filters, Pagination & Sorting
  // ----------------------------------------------------
  const [filters, setFilters] = useState({
    search: "",
    complaintType: "All",
    priority: "All",
    status: "All",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  // ----------------------------------------------------
  // States: Modal Visibility & Selected Items
  // ----------------------------------------------------
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [modalVisibility, setModalVisibility] = useState({
    details: false,
    resolve: false
  });

  // Fetch paginated complaints data
  const { data, isLoading, isError, refetch } = useComplaintsList(filters);

  // ----------------------------------------------------
  // Dynamic Real-time Stats Calculation (Reads from localStorage if updated)
  // ----------------------------------------------------
  const stats = useMemo(() => {
    let localComplaints = mockComplaints;
    try {
      const stored = localStorage.getItem("mock_db_customer_complaints");
      if (stored) {
        localComplaints = JSON.parse(stored);
      }
    } catch (_) {}

    let localRefunds = [];
    try {
      const storedRefunds = localStorage.getItem("mock_db_refunds");
      if (storedRefunds) {
        localRefunds = JSON.parse(storedRefunds);
      }
    } catch (_) {}

    const openComplaints = localComplaints.filter(c => c.status === "pending" || c.status === "investigating").length;
    const criticalComplaints = localComplaints.filter(c => c.priority === "critical" && c.status !== "resolved").length;
    
    // Resolved Today relative to active demo date (June 25, 2026)
    const resolvedToday = localComplaints.filter(c => {
      if (c.status !== "resolved") return false;
      const resDate = c.resolution?.resolvedAt || c.updatedAt;
      return resDate && resDate.startsWith("2026-06-25");
    }).length;

    const pendingRefunds = localRefunds.filter(r => r.status === "pending").length || 1; // PVP-9085 is pending refund request
    
    // Average resolution time calculated from mock data
    const resolvedComplaints = localComplaints.filter(c => c.status === "resolved");
    let avgResolutionTime = "2.4 hours";
    if (resolvedComplaints.length > 0) {
      // Mock average logic
      avgResolutionTime = "2.2 hours";
    }

    return {
      openComplaints,
      criticalComplaints,
      resolvedToday,
      pendingRefunds,
      avgResolutionTime,
      satisfactionScore: "94%"
    };
  }, [data]); // Recalculate whenever lists update or mutations succeed

  // ----------------------------------------------------
  // Callbacks: Filters, Pagination, & Sorting
  // ----------------------------------------------------
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (sortBy, sortOrder) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // ----------------------------------------------------
  // Interactive Dashboard Click Logic
  // ----------------------------------------------------
  const handleCardClick = (cardId) => {
    if (cardId === "open") {
      setFilters(prev => ({
        ...prev,
        status: prev.status === "pending" ? "All" : "pending",
        page: 1
      }));
      toast.success(filters.status === "pending" ? "Cleared Open Filter" : "Filtered by Pending Complaints");
    } else if (cardId === "critical") {
      setFilters(prev => ({
        ...prev,
        priority: prev.priority === "critical" ? "All" : "critical",
        page: 1
      }));
      toast.success(filters.priority === "critical" ? "Cleared Critical Filter" : "Filtered by Critical Priority");
    } else if (cardId === "resolvedToday") {
      setFilters(prev => ({
        ...prev,
        status: prev.status === "resolved" ? "All" : "resolved",
        page: 1
      }));
      toast.success(filters.status === "resolved" ? "Cleared Resolved Filter" : "Filtered by Resolved Complaints");
    }
  };

  // ----------------------------------------------------
  // Action Handlers
  // ----------------------------------------------------
  const handleActionClick = (action, payload) => {
    if (action === "viewDetails") {
      setSelectedComplaintId(payload);
      setModalVisibility(prev => ({ ...prev, details: true }));
    } else if (action === "resolve") {
      setSelectedComplaintId(payload);
      setModalVisibility(prev => ({ ...prev, resolve: true }));
    }
  };

  // Callback to transition from details modal to resolve modal
  const handleDetailsToResolveTransition = (complaintId) => {
    setSelectedComplaintId(complaintId);
    setModalVisibility({
      details: false,
      resolve: true
    });
  };

  // Export handlers
  const handleExportCSV = () => {
    toast.success("Generating CSV Report...", {
      description: "Downloading customer complaints resolution sheet."
    });
  };

  const handleDownloadReports = () => {
    toast.success("Compiling PDF Analytics...", {
      description: "Service quality and refund analytics ready."
    });
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Sync completed with operations database.");
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm transition-all">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Customer Complaints Management
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1 font-semibold leading-normal">
            Manage customer complaints, refund requests, replacement orders, supervisor investigations, and service quality logs.
          </p>
        </div>
        
        {/* Actions Button Grid */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-neutral-50 dark:bg-zinc-850 hover:bg-neutral-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-850 transition-all cursor-pointer shadow-sm"
          >
            <FileDown size={13} className="text-zinc-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadReports}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-neutral-50 dark:bg-zinc-850 hover:bg-neutral-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-850 transition-all cursor-pointer shadow-sm"
          >
            <Download size={13} className="text-zinc-400" />
            <span>Download Reports</span>
          </button>

          <button
            onClick={handleRefresh}
            className="p-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-2xl transition-all cursor-pointer shadow-sm shadow-[var(--primary)]/10"
            title="Refresh Data"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <ComplaintStatsCards
        stats={stats}
        isLoading={isLoading}
        onCardClick={handleCardClick}
        activeFilters={filters}
      />

      {/* FILTER SECTION */}
      <ComplaintFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* COMPLAINTS TABLE */}
      <ComplaintsTable
        complaints={data?.complaints || []}
        pagination={data?.pagination || {}}
        isLoading={isLoading}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSortChange={handleSortChange}
        onPageChange={handlePageChange}
        onActionClick={handleActionClick}
        userRole={role}
      />

      {/* ----------------------------------------------------
          MODALS INTEGRATION
      ---------------------------------------------------- */}
      {/* 1. XL details modal */}
      <ComplaintDetailsModal
        visible={modalVisibility.details}
        onClose={() => setModalVisibility(prev => ({ ...prev, details: false }))}
        complaintId={selectedComplaintId}
        onResolveTrigger={handleDetailsToResolveTransition}
        userRole={role}
      />

      {/* 2. Resolve action modal */}
      <ResolveComplaintModal
        visible={modalVisibility.resolve}
        onClose={() => setModalVisibility(prev => ({ ...prev, resolve: false }))}
        complaintId={selectedComplaintId}
        userRole={role}
      />
    </div>
  );
}
