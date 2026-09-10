import React, { useState, useEffect } from "react";
import { Search, RotateCcw, RefreshCw, Navigation } from "lucide-react";
import { Input, Select } from "antd";

// Hooks
import useRiders from "./hooks/useRiders";
import useRiderDetails from "./hooks/useRiderDetails";
import useRiderSocket from "./hooks/useRiderSocket";

// Components
import SocketStatusBadge from "../kitchenOperations/components/SocketStatusBadge";
import RiderStatsCards from "./components/RiderStatsCards";
import RidersTable from "./components/RidersTable";
import RiderDetailsModal from "./components/RiderDetailsModal";

export default function RiderAvailability() {
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
    availability: "All",
    status: "All",
    vehicleType: "All"
  });
  const [searchInput, setSearchInput] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Queries & Sockets
  const { data: ridersList = [], isLoading: isLoadingRiders, refetch: refetchRiders } = useRiders(filters);
  const { socketConnected } = useRiderSocket();

  // Modal details state
  const [selectedRiderId, setSelectedRiderId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data: riderDetail, isLoading: isLoadingDetail } = useRiderDetails(selectedRiderId);

  const handleManualRefetch = () => {
    refetchRiders();
    setLastRefreshed(new Date());
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setFilters({
      search: "",
      availability: "All",
      status: "All",
      vehicleType: "All"
    });
  };

  const handleOpenDetails = (rider) => {
    setSelectedRiderId(rider._id);
    setShowDetailsModal(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-8xl mx-auto min-h-screen text-slate-800 dark:text-zinc-200">
      
      {/* Page Header */}
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-zinc-850 shadow-sm transition-all duration-300">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Rider Availability</span>
            <Navigation size={16} className="text-[var(--primary)] animate-pulse" />
          </h1>
          <p className="text-xs font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
            Monitor all riders associated with the store in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SocketStatusBadge connected={socketConnected} />

          <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-zinc-855">
            UPDATED: {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
          </span>

          <button
            onClick={handleManualRefetch}
            className="h-8 w-8 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-slate-655 dark:text-zinc-400 border border-slate-150 dark:border-zinc-850 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm hover:rotate-180 duration-500"
            title="Refresh Station"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <RiderStatsCards riders={ridersList} />

      {/* Main Table section */}
      <div className="space-y-4">
        
        {/* Filters Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-3 rounded-2.5xl flex flex-wrap gap-2.5 items-center justify-between shadow-sm transition-all duration-300">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <Input
              prefix={<Search size={14} className="text-slate-400 mr-1" />}
              placeholder="Search Rider Name, Phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="compact-input rounded-xl text-xs h-9 bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-855 hover:border-slate-200 dark:hover:border-zinc-850 text-slate-800 dark:text-white"
              allowClear
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Availability:</span>
              <Select
                value={filters.availability || "All"}
                onChange={(val) => setFilters(prev => ({ ...prev, availability: val }))}
                className="sa-select w-28 text-xs"
                options={[
                  { value: "All", label: "All" },
                  { value: "Online", label: "Online" },
                  { value: "Offline", label: "Offline" }
                ]}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Status:</span>
              <Select
                value={filters.status || "All"}
                onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
                className="sa-select w-28 text-xs"
                options={[
                  { value: "All", label: "All" },
                  { value: "Idle", label: "Idle" },
                  { value: "Busy", label: "Busy" }
                ]}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Vehicle:</span>
              <Select
                value={filters.vehicleType || "All"}
                onChange={(val) => setFilters(prev => ({ ...prev, vehicleType: val }))}
                className="sa-select w-28 text-xs"
                options={[
                  { value: "All", label: "All" },
                  { value: "Bike", label: "Bike" },
                  { value: "Scooter", label: "Scooter" }
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

        {/* Riders Table view */}
        <RidersTable
          riders={ridersList}
          isLoading={isLoadingRiders}
          onViewRider={handleOpenDetails}
        />

      </div>

      {/* Details drawer/modal popup */}
      <RiderDetailsModal
        visible={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedRiderId(null);
        }}
        riderId={selectedRiderId}
        rider={riderDetail}
        isLoading={isLoadingDetail}
      />

    </div>
  );
}
