import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, MoreVertical, ChevronLeft, ChevronRight, Eye, Edit2, RotateCw, Trash2, ShieldAlert, BarChart2, Ban, CheckCircle, XCircle } from "lucide-react";

export default function FranchiseStoresData({ 
  stores = [], 
  setStores, 
  onFilteredStoresChange,
  onRowClick, 
  onEdit, 
  onReassignManager, 
  onChangeFranchise, 
  onViewAnalytics, 
  onSuspendActivate,
  onCloseStore
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeDropdownRow, setActiveDropdownRow] = useState(null);

  // Advanced Filters State
  const [filterFranchise, setFilterFranchise] = useState("");
  const [filterStoreName, setFilterStoreName] = useState("");
  const [filterStoreCode, setFilterStoreCode] = useState("");
  const [filterManager, setFilterManager] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterApproval, setFilterApproval] = useState("");

  // Debouncing effect for search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Handle outside clicks to close dropdown menus
  useEffect(() => {
    const closeDropdowns = () => setActiveDropdownRow(null);
    window.addEventListener("click", closeDropdowns);
    return () => window.removeEventListener("click", closeDropdowns);
  }, []);

  const handleDropdownClick = (e, storeId) => {
    e.stopPropagation();
    if (activeDropdownRow === storeId) {
      setActiveDropdownRow(null);
    } else {
      setActiveDropdownRow(storeId);
    }
  };

  const handleResetFilters = () => {
    setFilterFranchise("");
    setFilterStoreName("");
    setFilterStoreCode("");
    setFilterManager("");
    setFilterLocation("");
    setFilterType("");
    setFilterStatus("");
    setFilterApproval("");
    setSearchTerm("");
  };

  // Filter logic
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchSearch =
        debouncedSearch === "" ||
        store.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        store.id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        store.manager.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchFranchise = filterFranchise === "" || store.franchise.toLowerCase().includes(filterFranchise.toLowerCase());
      const matchStoreName = filterStoreName === "" || store.name.toLowerCase().includes(filterStoreName.toLowerCase());
      const matchStoreCode = filterStoreCode === "" || store.id.toLowerCase().includes(filterStoreCode.toLowerCase());
      const matchManager = filterManager === "" || store.manager.toLowerCase().includes(filterManager.toLowerCase());
      const matchLocation = filterLocation === "" || store.location.toLowerCase().includes(filterLocation.toLowerCase());
      const matchType = filterType === "" || store.type === filterType;
      const matchStatus = filterStatus === "" || store.status === filterStatus;
      const matchApproval = filterApproval === "" || store.approval === filterApproval;

      return matchSearch && matchFranchise && matchStoreName && matchStoreCode && matchManager && matchLocation && matchType && matchStatus && matchApproval;
    });
  }, [stores, debouncedSearch, filterFranchise, filterStoreName, filterStoreCode, filterManager, filterLocation, filterType, filterStatus, filterApproval]);

  useEffect(() => {
    if (onFilteredStoresChange) {
      onFilteredStoresChange(filteredStores);
    }
  }, [filteredStores, onFilteredStoresChange]);

  return (
    <div className="space-y-3.5">
      {/* Search & Collapsible Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black dark:text-zinc-350" size={14} />
              <input
                className="w-full pl-8.5 pr-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg text-xs text-black dark:text-white placeholder-zinc-450 focus:ring-1 focus:ring-red-500/20 focus:border-red-650 outline-none transition-all"
                placeholder="Search by Store Name, Code or Manager..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                showFilters ? 'bg-zinc-200 border-zinc-400 text-black dark:bg-zinc-800 dark:text-white' : 'bg-white border-zinc-250 dark:bg-zinc-900 text-black dark:text-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Filter size={13} />
              <span>Filters</span>
            </button>
          </div>
          <div className="text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">
            Showing {filteredStores.length} stores in India
          </div>
        </div>

        {/* Collapsible Filter Content */}
        {showFilters && (
          <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Franchise</label>
                <select 
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs font-semibold text-black dark:text-white outline-none"
                  value={filterFranchise}
                  onChange={(e) => setFilterFranchise(e.target.value)}
                >
                  <option value="">All Franchises</option>
                  <option value="North India">North India</option>
                  <option value="Western Hub">Western Hub</option>
                  <option value="MP & Central">MP &amp; Central</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Store Name</label>
                <input 
                  type="text" 
                  value={filterStoreName}
                  onChange={(e) => setFilterStoreName(e.target.value)}
                  placeholder="e.g. Bandra"
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs text-black dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Store Code</label>
                <input 
                  type="text" 
                  value={filterStoreCode}
                  onChange={(e) => setFilterStoreCode(e.target.value)}
                  placeholder="e.g. PV-MUM"
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs text-black dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Manager</label>
                <input 
                  type="text" 
                  value={filterManager}
                  onChange={(e) => setFilterManager(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs text-black dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Location</label>
                <input 
                  type="text" 
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  placeholder="e.g. Connaught Place"
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs text-black dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Type</label>
                <select 
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs font-semibold text-black dark:text-white outline-none"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="DINE_IN">DINE_IN</option>
                  <option value="TAKEAWAY">TAKEAWAY</option>
                  <option value="DELIVERY">DELIVERY</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Status</label>
                <select 
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs font-semibold text-black dark:text-white outline-none"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Approval</label>
                <select 
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs font-semibold text-black dark:text-white outline-none"
                  value={filterApproval}
                  onChange={(e) => setFilterApproval(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 shrink-0 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button 
                onClick={handleResetFilters}
                className="px-4 py-1.5 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-300 font-bold text-[10px] rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors uppercase tracking-wider"
              >
                Reset Filters
              </button>
              <button 
                onClick={() => setShowFilters(false)}
                className="px-4 py-1.5 bg-red-650 text-white font-bold text-[10px] rounded-lg hover:bg-red-700 transition-colors uppercase tracking-wider"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Data Grid */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-[1250px]">
            <thead>
               <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 select-none">
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider w-8">
                  <input type="checkbox" className="rounded border-zinc-300 text-red-650 focus:ring-red-650" />
                </th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Store ID</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Store</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Franchise</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Manager</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Location</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Type</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Approval</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Created</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {filteredStores.map((store) => (
                <tr 
                  key={store.id} 
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-850/40 transition-colors cursor-pointer group" 
                  onClick={() => onRowClick && onRowClick(store)}
                >
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-zinc-300 text-red-650 focus:ring-red-650" />
                  </td>
                  <td className="px-3 py-2.5 font-bold font-mono text-zinc-900 dark:text-zinc-100">{store.id}</td>
                  <td className="px-3 py-2.5 font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-red-650 dark:group-hover:text-red-400 transition-colors">{store.name}</td>
                  <td className="px-3 py-2.5 text-black dark:text-zinc-300">{store.franchise}</td>
                  <td className="px-3 py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">{store.manager}</td>
                  <td className="px-3 py-2.5 text-black dark:text-zinc-350 max-w-[150px] truncate">{store.location}</td>
                  <td className="px-3 py-2.5 text-black dark:text-zinc-350">{store.type}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border inline-flex items-center gap-1 ${
                      store.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                        : store.status === 'Closed' || store.status === 'Pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' 
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-455 dark:border-rose-900/30'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        store.status === 'Active' ? 'bg-emerald-500' :
                        store.status === 'Closed' || store.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}></span>
                      {store.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-black dark:text-zinc-350">{store.approval}</td>
                  <td className="px-3 py-2.5 text-black dark:text-zinc-300 font-mono text-[10px]">{store.createdDate}</td>
                  
                  {/* Actions column */}
                  <td className="px-3 py-2.5 text-right relative" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => onRowClick && onRowClick(store)}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-350 rounded-lg transition-colors cursor-pointer"
                        title="View complete store details"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        onClick={() => onSuspendActivate && onSuspendActivate(store, 'suspend')}
                        className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-550 rounded-lg transition-colors cursor-pointer"
                        title="Temporarily suspend an active store"
                      >
                        <Ban size={14} />
                      </button>
                      <button 
                        onClick={() => onSuspendActivate && onSuspendActivate(store, 'activate')}
                        className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                        title="Reactivate a suspended store"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button 
                        onClick={() => onCloseStore && onCloseStore(store)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Permanently close the store"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStores.length === 0 && (
                <tr>
                  <td colSpan="15" className="px-3 py-8 text-center text-zinc-455 dark:text-zinc-555 text-xs font-medium italic bg-zinc-50/20 dark:bg-zinc-950/20">
                    No store locations matched the selected filter configuration.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 flex-wrap gap-2 select-none">
          <span className="text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">
            Showing 1 to {filteredStores.length} of {filteredStores.length} entries
          </span>
          <div className="flex gap-1">
            <button className="w-6.5 h-6.5 flex items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white transition-all cursor-pointer">
              <ChevronLeft size={12} />
            </button>
            <button className="w-6.5 h-6.5 flex items-center justify-center rounded bg-red-650 text-white font-bold text-[10px]">1</button>
            <button className="w-6.5 h-6.5 flex items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white transition-all cursor-pointer text-[10px]">2</button>
            <button className="w-6.5 h-6.5 flex items-center justify-center rounded border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white transition-all cursor-pointer">
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
