import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, MoreVertical, ChevronLeft, ChevronRight, Eye, Edit2, RotateCw, Trash2, ShieldAlert, BarChart2, Ban, CheckCircle } from "lucide-react";

export default function FranchiseStoresData({ 
  stores = [], 
  setStores, 
  onFilteredStoresChange,
  onRowClick, 
  onEdit, 
  onReassignManager, 
  onChangeFranchise, 
  onViewAnalytics, 
  onSuspendActivate 
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeDropdownRow, setActiveDropdownRow] = useState(null);

  // Advanced Filters State
  const [filterFranchise, setFilterFranchise] = useState("");
  const [filterStoreName, setFilterStoreName] = useState("");
  const [filterStoreCode, setFilterStoreCode] = useState("");
  const [filterStoreManager, setFilterStoreManager] = useState("");
  const [filterCountry, setFilterCountry] = useState("India");
  const [filterState, setFilterState] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterTerritory, setFilterTerritory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterInventory, setFilterInventory] = useState("");
  const [filterBusinessHours, setFilterBusinessHours] = useState("");

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
    setFilterStoreManager("");
    setFilterState("");
    setFilterCity("");
    setFilterRegion("");
    setFilterZone("");
    setFilterTerritory("");
    setFilterStatus("");
    setFilterInventory("");
    setFilterBusinessHours("");
    setSearchTerm("");
  };

  // Filter logic
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      const matchSearch =
        debouncedSearch === "" ||
        store.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        store.id.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        store.owner.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchFranchise = filterFranchise === "" || store.franchise.toLowerCase().includes(filterFranchise.toLowerCase());
      const matchStoreName = filterStoreName === "" || store.name.toLowerCase().includes(filterStoreName.toLowerCase());
      const matchStoreCode = filterStoreCode === "" || store.id.toLowerCase().includes(filterStoreCode.toLowerCase());
      const matchManager = filterStoreManager === "" || store.owner.toLowerCase().includes(filterStoreManager.toLowerCase());
      const matchState = filterState === "" || store.state.toLowerCase().includes(filterState.toLowerCase());
      const matchCity = filterCity === "" || store.city.toLowerCase().includes(filterCity.toLowerCase());
      const matchRegion = filterRegion === "" || store.region === filterRegion;
      const matchZone = filterZone === "" || store.zone === filterZone;
      const matchTerritory = filterTerritory === "" || store.territory.toLowerCase().includes(filterTerritory.toLowerCase());
      const matchStatus = filterStatus === "" || store.status === filterStatus;
      const matchInventory = filterInventory === "" || store.inventoryStatus === filterInventory;

      return matchSearch && matchFranchise && matchStoreName && matchStoreCode && matchManager && matchState && matchCity && matchRegion && matchZone && matchTerritory && matchStatus && matchInventory;
    });
  }, [stores, debouncedSearch, filterFranchise, filterStoreName, filterStoreCode, filterStoreManager, filterState, filterCity, filterRegion, filterZone, filterTerritory, filterStatus, filterInventory]);

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
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Store Manager</label>
                <input 
                  type="text" 
                  value={filterStoreManager}
                  onChange={(e) => setFilterStoreManager(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs text-black dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Country</label>
                <input 
                  type="text" 
                  value={filterCountry}
                  disabled
                  className="w-full h-8 px-2 bg-zinc-100 dark:bg-zinc-850 text-zinc-400 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">State</label>
                <input 
                  type="text" 
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs text-black dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">City</label>
                <input 
                  type="text" 
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs text-black dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Region</label>
                <select 
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs font-semibold text-black dark:text-white outline-none"
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                >
                  <option value="">All Regions</option>
                  <option value="North India">North India</option>
                  <option value="West India">West India</option>
                  <option value="South India">South India</option>
                  <option value="East India">East India</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Zone</label>
                <select 
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs font-semibold text-black dark:text-white outline-none"
                  value={filterZone}
                  onChange={(e) => setFilterZone(e.target.value)}
                >
                  <option value="">All Zones</option>
                  <option value="Zone A">Zone A</option>
                  <option value="Zone B">Zone B</option>
                  <option value="Zone C">Zone C</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Territory</label>
                <input 
                  type="text" 
                  value={filterTerritory}
                  onChange={(e) => setFilterTerritory(e.target.value)}
                  placeholder="e.g. Connaught Place"
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs text-black dark:text-white outline-none"
                />
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
                <label className="text-[9px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Inventory Status</label>
                <select 
                  className="w-full h-8 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-750 rounded-lg text-xs font-semibold text-black dark:text-white outline-none"
                  value={filterInventory}
                  onChange={(e) => setFilterInventory(e.target.value)}
                >
                  <option value="">All Stock Levels</option>
                  <option value="Healthy">Healthy</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
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
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Store Code</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Store Name</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Franchise</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Manager</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Region</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Zone</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Territory</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Address</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Today's Orders</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Active Kitchen</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Inventory</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider">Created Date</th>
                <th className="px-3 py-2 text-[10px] font-bold text-black dark:text-zinc-200 uppercase tracking-wider text-right">Actions</th>
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
                  <td className="px-3 py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">{store.owner}</td>
                  <td className="px-3 py-2.5 text-black dark:text-zinc-300">{store.region}</td>
                  <td className="px-3 py-2.5 text-black dark:text-zinc-300">{store.zone}</td>
                  <td className="px-3 py-2.5 text-black dark:text-zinc-300">{store.territory}</td>
                  <td className="px-3 py-2.5 text-black dark:text-zinc-350 max-w-[150px] truncate">{store.location}</td>
                  <td className="px-3 py-2.5 font-bold text-center text-zinc-900 dark:text-zinc-100">{store.ordersToday}</td>
                  <td className="px-3 py-2.5 font-bold text-center text-zinc-900 dark:text-zinc-100">{store.activeKitchenOrders}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border inline-flex items-center gap-1 ${
                      store.inventoryStatus === 'Healthy' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                        : store.inventoryStatus === 'Low Stock' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' 
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-455 dark:border-rose-900/30'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        store.inventoryStatus === 'Healthy' ? 'bg-emerald-500' :
                        store.inventoryStatus === 'Low Stock' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}></span>
                      {store.inventoryStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border inline-flex items-center gap-1 ${
                      store.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                        : store.status === 'Closed' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' 
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-455 dark:border-rose-900/30'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        store.status === 'Active' ? 'bg-emerald-500' :
                        store.status === 'Closed' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}></span>
                      {store.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-black dark:text-zinc-300 font-mono text-[10px]">{store.createdDate}</td>
                  
                  {/* Actions column */}
                  <td className="px-3 py-2.5 text-right relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => handleDropdownClick(e, store.id)}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-350 rounded-lg transition-colors cursor-pointer"
                    >
                      <MoreVertical size={14} />
                    </button>

                    {/* Actions Dropdown */}
                    {activeDropdownRow === store.id && (
                      <div className="absolute right-3.5 top-9 w-40 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 z-30 select-none animate-in fade-in slide-in-from-top-1 duration-150">
                        <button
                          onClick={() => {
                            setActiveDropdownRow(null);
                            onRowClick && onRowClick(store);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 text-[11px] font-bold text-black dark:text-zinc-200 flex items-center gap-1.5 transition-colors"
                        >
                          <Eye size={12} className="text-zinc-450" />
                          <span>View Details</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveDropdownRow(null);
                            onEdit && onEdit(store);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 text-[11px] font-bold text-black dark:text-zinc-200 flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 size={12} className="text-zinc-450" />
                          <span>Edit Store</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveDropdownRow(null);
                            onReassignManager && onReassignManager(store);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 text-[11px] font-bold text-black dark:text-zinc-200 flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCw size={12} className="text-zinc-455" />
                          <span>Reassign Manager</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveDropdownRow(null);
                            onChangeFranchise && onChangeFranchise(store);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 text-[11px] font-bold text-black dark:text-zinc-200 flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 size={12} className="text-zinc-455" />
                          <span>Change Franchise</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveDropdownRow(null);
                            onViewAnalytics && onViewAnalytics(store);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 text-[11px] font-bold text-black dark:text-zinc-200 flex items-center gap-1.5 transition-colors"
                        >
                          <BarChart2 size={12} className="text-zinc-455" />
                          <span>View Analytics</span>
                        </button>
                        <hr className="border-zinc-200 dark:border-zinc-800 my-1" />
                        <button
                          onClick={() => {
                            setActiveDropdownRow(null);
                            onSuspendActivate && onSuspendActivate(store);
                          }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                            store.status === 'Active' ? 'text-rose-650' : 'text-emerald-600'
                          }`}
                        >
                          {store.status === 'Active' ? (
                            <>
                              <Ban size={12} />
                              <span>Suspend Store</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle size={12} />
                              <span>Activate Store</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
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
